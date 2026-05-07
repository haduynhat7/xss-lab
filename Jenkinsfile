pipeline {
    agent any

    tools {
        nodejs 'node' 
    }

    stages {
        stage('1. Setup & Clean Workspace') {
            steps {
                echo '--- Dọn dẹp không gian làm việc ---'
                sh 'rm -rf codeql-db codeql-results.sarif zap-report.html *.log'
                
                dir('backend') { sh 'npm install' }
                dir('frontend') { sh 'npm install' }
            }
        }

        stage('2. SCA Scan (Snyk)') {
            steps {
                echo '--- Snyk đang rà soát lỗ hổng thư viện ---'
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
                    echo '--- Kiểm tra và cài đặt CodeQL Bundle ---'
                    // LỆNH QUAN TRỌNG: Nếu thư mục javascript không tồn tại, xóa sạch để tải lại bản Bundle đầy đủ
                    sh '''
                        if [ ! -d "codeql-home/codeql/javascript" ]; then
                            echo "Phát hiện bộ CodeQL cũ/thiếu quy tắc. Đang xóa và tải lại bản Bundle đầy đủ..."
                            rm -rf codeql-home codeql-bundle.tar.gz
                            wget -q https://github.com/github/codeql-action/releases/latest/download/codeql-bundle-linux64.tar.gz -O codeql-bundle.tar.gz
                            mkdir -p codeql-home
                            tar -xzf codeql-bundle.tar.gz -C ./codeql-home
                            rm codeql-bundle.tar.gz
                            echo "Cài đặt CodeQL Bundle thành công!"
                        else
                            echo "CodeQL Bundle đã sẵn sàng."
                        fi
                    '''

                    echo '--- Bắt đầu phân tích bằng CodeQL ---'
                    sh '''
                        # 1. Tạo Database
                        ./codeql-home/codeql/codeql database create codeql-db --language=javascript --overwrite
                        
                        # 2. Chạy phân tích (Dùng tên suite chuẩn của Bundle)
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
                    echo '--- Chuẩn bị OWASP ZAP ---'
                    sh '''
                        if [ ! -d "ZAP_2.16.0" ]; then
                            echo "Đang tải OWASP ZAP..."
                            wget -qO zap.tar.gz https://github.com/zaproxy/zaproxy/releases/download/v2.16.0/ZAP_2.16.0_Linux.tar.gz
                            tar -xzf zap.tar.gz
                            rm zap.tar.gz
                        fi
                    '''

                    echo '--- Khởi động ứng dụng Lab và quét XSS ---'
                    sh 'cd backend && nohup node server.js > ../backend.log 2>&1 &'
                    sh 'cd frontend && nohup npm start > ../frontend.log 2>&1 &'
                    
                    echo "Chờ 45 giây để hệ thống khởi động..."
                    sleep 45

                    sh '''
                        chmod +x ./ZAP_2.16.0/zap.sh
                        ./ZAP_2.16.0/zap.sh -cmd -quickurl http://localhost:3000 -quickout zap-report.html || true
                    '''
                }
            }
        }
    }

    post {
        always {
            echo '--- Tổng hợp báo cáo ---'
            archiveArtifacts artifacts: 'codeql-results.sarif, zap-report.html, *.log', allowEmptyArchive: true
            
            echo '--- Dọn dẹp hệ thống ---'
            sh '''
                pkill -f 'node server.js' || true
                pkill -f 'react-scripts start' || true
                pkill -f 'zap' || true
            '''
        }
    }
}