pipeline {
    agent any

    tools {
        // Tên 'node' phải khớp với tên bạn đặt trong Manage Jenkins -> Tools
        nodejs 'node' 
    }

    stages {
        stage('1. Setup & Clean Workspace') {
            steps {
                echo '--- Dọn dẹp và cài đặt thư viện ---'
                // Xóa các file cũ để tránh lỗi "Database already exists"
                sh 'rm -rf codeql-db codeql-results.sarif zap-report.html backend.log frontend.log'
                
                dir('backend') { sh 'npm install' }
                dir('frontend') { sh 'npm install' }
            }
        }

        stage('2. SCA Scan (Snyk)') {
            steps {
                echo '--- Snyk đang quét lỗ hổng thư viện ---'
                snykSecurity(
                    snykInstallation: 'snyk-cli',
                    snykTokenId: 'snyk-token', 
                    targetFile: 'frontend/package.json',
                    failOnIssues: false
                )
            }
        }

        stage('3. SAST Scan (CodeQL)') {
            steps {
                script {
                    echo '--- Chuẩn bị CodeQL Bundle (CLI + Queries) ---'
                    // Tải bản Bundle nặng ~1GB chứa sẵn các bộ quy tắc .qls
                    sh '''
                        if [ ! -d "codeql-home/codeql" ]; then
                            echo "Đang tải CodeQL Bundle... (Vui lòng đợi vài phút)"
                            rm -rf codeql-home codeql-bundle.tar.gz
                            wget -q https://github.com/github/codeql-action/releases/latest/download/codeql-bundle-linux64.tar.gz -O codeql-bundle.tar.gz
                            mkdir -p codeql-home
                            tar -xzf codeql-bundle.tar.gz -C ./codeql-home
                            rm codeql-bundle.tar.gz
                        fi
                    '''

                    echo '--- Phân tích mã nguồn bằng CodeQL ---'
                    sh '''
                        # 1. Tạo database cho dự án Javascript
                        ./codeql-home/codeql/codeql database create codeql-db --language=javascript --overwrite
                        
                        # 2. Quét lỗi sử dụng đường dẫn file quy tắc chính xác trong Bundle
                        ./codeql-home/codeql/codeql database analyze codeql-db \
                        ./codeql-home/codeql/javascript/ql/src/codeql-suites/javascript-security-and-quality.qls \
                        --format=sarif-latest --output=codeql-results.sarif
                    '''
                }
            }
        }

        stage('4. DAST Scan (OWASP ZAP)') {
            steps {
                script {
                    echo '--- Chuẩn bị OWASP ZAP ---'
                    sh '''
                        if [ ! -d "ZAP_2.16.0" ]; then
                            echo "Đang tải OWASP ZAP..."
                            wget -qO zap.tar.gz https://github.com/zaproxy/zaproxy/releases/download/v2.16.0/ZAP_2.16.0_Linux.tar.gz
                            tar -xzf zap.tar.gz
                            rm zap.tar.gz
                        fi
                    '''

                    echo '--- Khởi động ứng dụng và quét DAST ---'
                    // Chạy Backend (cổng 3001) và Frontend (cổng 3000) ngầm
                    sh 'cd backend && nohup node server.js > ../backend.log 2>&1 &'
                    sh 'cd frontend && nohup npm start > ../frontend.log 2>&1 &'
                    
                    echo 'Đợi 45 giây để ứng dụng khởi động...'
                    sleep 45

                    echo 'ZAP đang thực hiện quét tấn công giả lập...'
                    // Thực hiện quét cổng 3000 (React)
                    sh './ZAP_2.16.0/zap.sh -cmd -quickurl http://localhost:3000 -quickout zap-report.html'
                }
            }
        }
    }

    post {
        always {
            echo '--- Pipeline kết thúc. Tổng hợp báo cáo ---'
            // Lưu trữ các file báo cáo để người dùng có thể tải về từ giao diện Jenkins
            archiveArtifacts artifacts: 'codeql-results.sarif, zap-report.html, *.log', allowEmptyArchive: true
            
            echo 'Dọn dẹp các tiến trình đang chạy ngầm...'
            // Lệnh quan trọng để không bị kẹt cổng cho lần Build sau
            sh "pkill -f 'node server.js' || true"
            sh "pkill -f 'react-scripts start' || true"
            sh "pkill -f 'zap' || true"
        }
    }
}