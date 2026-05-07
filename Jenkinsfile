pipeline {
    agent any

    tools {
        // Tên 'node' phải trùng với tên bạn đặt trong Manage Jenkins -> Tools
        nodejs 'node' 
    }

    stages {
        stage('1. Setup & Clean Workspace') {
            steps {
                echo 'Đang dọn dẹp không gian làm việc và cài đặt thư viện...'
                // Xóa các file kết quả cũ để tránh xung đột
                sh 'rm -rf codeql-db codeql-results.sarif zap-report.html backend.log frontend.log'
                
                dir('backend') { 
                    sh 'npm install' 
                }
                dir('frontend') { 
                    sh 'npm install' 
                }
            }
        }

        stage('2. SCA Scan (Snyk)') {
            steps {
                echo 'Snyk đang quét các thư viện (dependencies) lỗi thời...'
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
                    echo 'Chuẩn bị môi trường CodeQL Bundle (CLI + Queries)...'
                    sh '''
                        if [ ! -d "codeql-home/codeql" ]; then
                            echo "Đang tải CodeQL Bundle... (Vui lòng đợi 3-5 phút)"
                            rm -rf codeql-home codeql-bundle.tar.gz
                            wget -q https://github.com/github/codeql-action/releases/latest/download/codeql-bundle-linux64.tar.gz
                            mkdir -p codeql-home
                            tar -xzf codeql-bundle-linux64.tar.gz -C ./codeql-home
                            rm codeql-bundle-linux64.tar.gz
                        fi
                    '''

                    echo 'Bắt đầu phân tích mã nguồn bằng CodeQL...'
                    sh '''
                        # 1. Tạo database cho Javascript
                        ./codeql-home/codeql/codeql database create codeql-db --language=javascript --overwrite
                        
                        # 2. Quét lỗi bằng bộ quy tắc Security & Quality
                        ./codeql-home/codeql/codeql database analyze codeql-db \
                        javascript-security-and-quality.qls \
                        --format=sarif-latest --output=codeql-results.sarif
                    '''
                }
            }
        }

        stage('4. DAST Scan (OWASP ZAP)') {
            steps {
                script {
                    echo 'Chuẩn bị OWASP ZAP...'
                    sh '''
                        if [ ! -d "ZAP_2.16.0" ]; then
                            echo "Đang tải OWASP ZAP..."
                            wget -qO zap.tar.gz https://github.com/zaproxy/zaproxy/releases/download/v2.16.0/ZAP_2.16.0_Linux.tar.gz
                            tar -xzf zap.tar.gz
                            rm zap.tar.gz
                        fi
                    '''

                    echo 'Khởi động ứng dụng Lab...'
                    // Chạy server ngầm
                    sh 'cd backend && nohup node server.js > ../backend.log 2>&1 &'
                    sh 'cd frontend && nohup npm start > ../frontend.log 2>&1 &'
                    
                    echo 'Chờ hệ thống khởi động hoàn toàn...'
                    sleep 45

                    echo 'ZAP đang thực hiện quét lỗi XSS...'
                    sh './ZAP_2.16.0/zap.sh -cmd -quickurl http://localhost:3000 -quickout zap-report.html'
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline kết thúc. Đang lưu trữ báo cáo...'
            
            // Lưu báo cáo để tải về từ giao diện Jenkins
            archiveArtifacts artifacts: 'codeql-results.sarif, zap-report.html, *.log', allowEmptyArchive: true
            
            echo 'Dọn dẹp tiến trình chạy ngầm...'
            sh "pkill -f 'node server.js' || true"
            sh "pkill -f 'react-scripts start' || true"
            sh "pkill -f 'zap' || true"
        }
    }
}