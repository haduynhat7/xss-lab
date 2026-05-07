pipeline {
    agent any

    // --- XÓA KHỐI ENVIRONMENT NÀY ---
    // environment {
    //    SNYK_TOKEN = credentials('snyk-token')
    // }

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
                // Plugin sẽ tự động tìm ID 'snyk-token' trong Jenkins Credentials
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
                    sh 'cd backend && nohup node server.js & '
                    sh 'cd frontend && nohup npm start & '
                    sleep 30
                    // Đảm bảo đường dẫn tới zap.sh là chính xác trên máy Jenkins
                    sh './ZAP_2.16.0/zap.sh -cmd -quickurl http://localhost:3000 -quickout zap_report.html'
                }
            }
        }
    }

    post {
        always {
            echo 'Hoàn thành quét bảo mật. Hãy kiểm tra các file báo cáo!'
            // Tắt các tiến trình chạy ngầm để tránh treo cổng port
            sh "pkill -f 'node server.js' || true"
            sh "pkill -f 'react-scripts start' || true"
        }
    }
}