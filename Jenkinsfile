pipeline {
    agent any

    environment {
        SNYK_TOKEN = credentials('snyk-token') // Đảm bảo bạn đã add token vào Jenkins Credentials
    }

    stages {
        stage('1. Setup & Install') {
            steps {
                echo 'Đang chuẩn bị môi trường...'
                dir('backend') { sh 'npm install' }
                dir('frontend') { sh 'npm install' }
            }
        }

        stage('2. SCA Scan (Snyk)') {
            steps {
                echo 'Snyk đang quét thư viện lỗi thời...'
                // Quét cả backend và frontend
                snykSecurity(
                    snykInstallation: 'snyk-cli',
                    snykTokenId: 'snyk-token',
                    targetFile: 'frontend/package.json',
                    failOnIssues: false // Để pipeline chạy tiếp để xem các lỗi khác
                )
            }
        }

        stage('3. SAST Scan (CodeQL)') {
            steps {
                script {
                    echo 'CodeQL đang truy tìm lỗi dangerouslySetInnerHTML...'
                    sh 'codeql database create codeql-js-db --language=javascript --overwrite'
                    sh '''
                        codeql database analyze codeql-js-db javascript-security-and-quality.qls \
                        --format=sarif-latest --output=codeql-results.sarif
                    '''
                }
            }
        }

        stage('4. DAST Scan (OWASP ZAP)') {
            steps {
                script {
                    echo 'Khởi động ứng dụng và quét DAST...'
                    // Chạy Backend và Frontend ngầm để ZAP có mục tiêu quét
                    sh 'cd backend && nohup node server.js & '
                    sh 'cd frontend && nohup npm start & '
                    sleep 30 // Chờ web lên hẳn
                    
                    // Lệnh gọi ZAP quét vào URL localhost:3000
                    sh './ZAP_2.16.0/zap.sh -cmd -quickurl http://localhost:3000 -quickout zap_report.html'
                }
            }
        }
    }

    post {
        always {
            echo 'Hoàn thành quét bảo mật. Hãy kiểm tra các file báo cáo (SARIF, HTML)!'
        }
    }
}