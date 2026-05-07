pipeline {
    agent any

    tools {
        nodejs 'node' // Đảm bảo bạn đã đặt tên 'node' trong Global Tool Configuration
    }

    stages {
        stage('1. Setup & Clean Workspace') {
            steps {
                echo 'Đang dọn dẹp và cài đặt thư viện...'
                // Dọn dẹp database cũ và file nén lỗi nếu có
                sh 'rm -rf codeql-db codeql-results.sarif zap-report.html backend.log frontend.log'
                
                dir('backend') { sh 'npm install' }
                dir('frontend') { sh 'npm install' }
            }
        }

        stage('2. SCA Scan (Snyk)') {
            steps {
                echo 'Snyk đang quét các thư viện (dependencies)...'
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
                    echo 'Chuẩn bị môi trường CodeQL...'
                    // Chỉ tải nếu chưa có thư mục codeql-home hoàn chỉnh
                    sh '''
                        if [ ! -d "codeql-home/codeql" ]; then
                            echo "Đang tải CodeQL CLI..."
                            rm -rf codeql-home codeql-linux64.zip
                            wget -q https://github.com/github/codeql-cli-binaries/releases/latest/download/codeql-linux64.zip
                            unzip -q codeql-linux64.zip -d ./codeql-home
                            rm codeql-linux64.zip
                        fi
                    '''

                    echo 'Bắt đầu phân tích mã nguồn bằng CodeQL...'
                    sh '''
                        ./codeql-home/codeql/codeql database create codeql-db --language=javascript --overwrite
                        ./codeql-home/codeql/codeql database analyze codeql-db javascript-security-and-quality.qls \
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
                    // Chạy server ngầm và đẩy log ra file để theo dõi
                    sh 'cd backend && nohup node server.js > ../backend.log 2>&1 &'
                    sh 'cd frontend && nohup npm start > ../frontend.log 2>&1 &'
                    
                    echo 'Chờ 45 giây để ứng dụng lên hẳn...'
                    sleep 45

                    echo 'ZAP đang tấn công giả lập vào cổng 3000...'
                    // Thực hiện quét DAST
                    sh './ZAP_2.16.0/zap.sh -cmd -quickurl http://localhost:3000 -quickout zap-report.html'
                }
            }
        }
    }

    post {
        always {
            echo 'Hoàn thành Pipeline. Đang tổng hợp báo cáo và dọn dẹp...'
            
            // 1. Lưu báo cáo vào phần Artifacts của Jenkins để tải về
            archiveArtifacts artifacts: 'codeql-results.sarif, zap-report.html, *.log', allowEmptyArchive: true
            
            // 2. Tắt các tiến trình chạy ngầm để giải phóng RAM và Port
            sh "pkill -f 'node server.js' || true"
            sh "pkill -f 'react-scripts start' || true"
            sh "pkill -f 'zap' || true"
            
            echo '--- PIPELINE FINISHED ---'
        }
    }
}