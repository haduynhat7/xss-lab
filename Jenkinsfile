pipeline {
    agent any
    tools { nodejs 'node' }

    stages {
        stage('1. Setup & Install') {
            steps {
                echo 'Cài đặt thư viện...'
                dir('backend') { sh 'npm install' }
                dir('frontend') { sh 'npm install' }
            }
        }

        stage('2. SCA Scan (Snyk)') {
            steps {
                echo 'Snyk đang rà soát dependencies...'
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
                    echo 'Chuẩn bị CodeQL CLI...'
                    // Tự động tải CodeQL nếu chưa có (Dành cho môi trường Docker)
                    sh '''
                        if [ ! -d "codeql-home" ]; then
                            wget https://github.com/github/codeql-cli-binaries/releases/latest/download/codeql-linux64.zip
                            unzip codeql-linux64.zip -d ./codeql-home
                            rm codeql-linux64.zip
                        fi
                    '''
                    echo 'CodeQL đang truy tìm lỗi XSS trong mã nguồn...'
                    sh '''
                        ./codeql-home/codeql/codeql database create codeql-js-db --language=javascript --overwrite
                        ./codeql-home/codeql/codeql database analyze codeql-js-db javascript-security-and-quality.qls --format=sarif-latest --output=codeql-results.sarif
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
                            wget https://github.com/zaproxy/zaproxy/releases/download/v2.16.0/ZAP_2.16.0_Linux.tar.gz
                            tar -xvf ZAP_2.16.0_Linux.tar.gz
                            rm ZAP_2.16.0_Linux.tar.gz
                        fi
                    '''
                    echo 'Khởi động ứng dụng và quét DAST...'
                    sh 'cd backend && nohup node server.js > backend.log 2>&1 &'
                    sh 'cd frontend && nohup npm start > frontend.log 2>&1 &'
                    sleep 40
                    sh './ZAP_2.16.0/zap.sh -cmd -quickurl http://localhost:3000 -quickout zap_report.html'
                }
            }
        }
    }

    post {
        always {
            echo 'Dọn dẹp tiến trình...'
            sh "pkill -f 'node server.js' || true"
            sh "pkill -f 'react-scripts start' || true"
        }
    }
}