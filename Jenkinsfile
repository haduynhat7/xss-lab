pipeline {
    agent any

    tools {
        nodejs 'node' 
    }

    stages {
        stage('1. Setup & Clean Workspace') {
            steps {
                echo 'Dọn dẹp và cài đặt thư viện...'
                sh 'rm -rf codeql-db codeql-results.sarif zap-report.html backend.log frontend.log'
                dir('backend') { sh 'npm install' }
                dir('frontend') { sh 'npm install' }
            }
        }

        stage('2. SCA Scan (Snyk)') {
            steps {
                echo 'Snyk đang quét dependencies...'
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
                    echo 'Chuẩn bị CodeQL Bundle...'
                    sh '''
                        if [ ! -d "codeql-home/codeql" ]; then
                            echo "Tải CodeQL Bundle..."
                            rm -rf codeql-home codeql-bundle.tar.gz
                            wget -q https://github.com/github/codeql-action/releases/latest/download/codeql-bundle-linux64.tar.gz -O codeql-bundle.tar.gz
                            mkdir -p codeql-home
                            tar -xzf codeql-bundle.tar.gz -C ./codeql-home
                            rm codeql-bundle.tar.gz
                        fi
                    '''

                    echo 'Phân tích mã nguồn bằng CodeQL...'
                    sh '''
                        # Tạo database (Javascript)
                        ./codeql-home/codeql/codeql database create codeql-db --language=javascript --overwrite
                        
                        # QUAN TRỌNG: Sửa lệnh quét bằng cách gọi trực tiếp Pack name
                        ./codeql-home/codeql/codeql database analyze codeql-db \
                        codeql/javascript-queries \
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
                            wget -qO zap.tar.gz https://github.com/zaproxy/zaproxy/releases/download/v2.16.0/ZAP_2.16.0_Linux.tar.gz
                            tar -xzf zap.tar.gz
                            rm zap.tar.gz
                        fi
                    '''

                    echo 'Khởi động Lab và quét DAST...'
                    sh 'cd backend && nohup node server.js > ../backend.log 2>&1 &'
                    sh 'cd frontend && nohup npm start > ../frontend.log 2>&1 &'
                    sleep 45

                    # Quét cổng 3000
                    sh './ZAP_2.16.0/zap.sh -cmd -quickurl http://localhost:3000 -quickout zap-report.html'
                }
            }
        }
    }

    post {
        always {
            echo 'Lưu trữ báo cáo...'
            archiveArtifacts artifacts: 'codeql-results.sarif, zap-report.html, *.log', allowEmptyArchive: true
            
            echo 'Dọn dẹp tiến trình...'
            sh "pkill -f 'node server.js' || true"
            sh "pkill -f 'react-scripts start' || true"
            sh "pkill -f 'zap' || true"
        }
    }
}