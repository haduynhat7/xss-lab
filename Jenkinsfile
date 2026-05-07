pipeline {
    agent any

    // BẮT BUỘC PHẢI CÓ KHỐI NÀY ĐỂ JENKINS TẢI NPM
    tools {
        nodejs 'node' 
    }

    stages {
        stage('1. Setup & Install') {
            steps {
                echo 'Đang cài đặt thư viện cho dự án...'
                dir('backend') { sh 'npm install' }
                dir('frontend') { sh 'npm install' }
            }
        }

        stage('2. SCA Scan (Snyk)') {
            steps {
                echo 'Snyk đang quét thư viện...'
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
                    echo 'CodeQL đang truy tìm lỗi XSS...'
                    sh 'codeql database create codeql-js-db --language=javascript --overwrite'
                    sh 'codeql database analyze codeql-js-db javascript-security-and-quality.qls --format=sarif-latest --output=codeql-results.sarif'
                }
            }
        }

        stage('4. DAST Scan (OWASP ZAP)') {
            steps {
                script {
                    echo 'Khởi động ứng dụng và quét DAST...'
                    sh 'cd backend && nohup node server.js > backend.log 2>&1 &'
                    sh 'cd frontend && nohup npm start > frontend.log 2>&1 &'
                    sleep 30
                    sh './ZAP_2.16.0/zap.sh -cmd -quickurl http://localhost:3000 -quickout zap_report.html'
                }
            }
        }
    }

    post {
        always {
            echo 'Dọn dẹp và hoàn tất!'
            sh "pkill -f 'node server.js' || true"
            sh "pkill -f 'react-scripts start' || true"
        }
    }
}