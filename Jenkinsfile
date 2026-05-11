pipeline {
    agent any

    tools {
        nodejs 'node' 
    }

    stages {
        stage('1. Setup & Clean Workspace') {
            steps {
                echo '--- Dọn dẹp không gian làm việc ---'
                sh 'rm -rf zap-report.html *.log codeql-db'
                
                dir('backend') { sh 'npm install' }
                dir('frontend') { sh 'npm install' }
            }
        }

        stage('2. Security Scan (Snyk SCA & SAST)') {
            steps {
                echo '--- Snyk rà soát thư viện (SCA) và mã nguồn (SAST) ---'
                
                // 1. Quét thư viện (SCA)
                snykSecurity(
                    snykInstallation: 'snyk-cli',
                    snykTokenId: 'snyk-token', 
                    targetFile: 'frontend/package.json',
                    failOnIssues: false
                )
                snykSecurity(
                    snykInstallation: 'snyk-cli',
                    snykTokenId: 'snyk-token', 
                    targetFile: 'backend/package.json',
                    failOnIssues: false
                )

                // 2. Quét mã nguồn (SAST) - Sử dụng đúng class cho Snyk Token
                script {
                    def snykTool = tool 'snyk-cli'
                    withCredentials([[$class: 'SnykApiTokenIdCredentialsBinding', credentialsId: 'snyk-token', variable: 'SNYK_TOKEN']]) {
                        sh "${snykTool}/snyk-linux code test --fail-on=all || true"
                    }
                }
            }
        }

        stage('3. DAST Scan (OWASP ZAP)') {
            steps {
                script {
                    echo '--- Chuẩn bị OWASP ZAP ---'
                    sh '''
                        if [ ! -d "ZAP_2.16.0" ]; then
                            echo "Đang tải OWASP ZAP bản đầy đủ..."
                            # PHẢI CÓ LINK ĐẦY ĐỦ NHƯ DƯỚI ĐÂY:
                            wget -q https://github.com -O zap.tar.gz
                            tar -xzf zap.tar.gz
                            rm zap.tar.gz
                        fi
                    '''

                    echo '--- Khởi động Lab và quét XSS ---'
                    sh 'cd backend && nohup node server.js > ../backend.log 2>&1 &'
                    sh 'cd frontend && nohup npm start > ../frontend.log 2>&1 &'
                    
                    echo "Chờ dịch vụ khởi động (60s)..."
                    sh 'timeout 60s bash -c "until curl -s localhost:3000 > /dev/null; do sleep 5; done" || true'

                    echo '--- Tiến hành quét DAST ---'
                    sh '''
                        chmod +x ./ZAP_2.16.0/zap.sh
                        ./ZAP_2.16.0/zap.sh -cmd -quickurl http://localhost:3000 -quickout $(pwd)/zap-report.html || true
                    '''
                }
            }
        }
    }

    post {
        always {
            echo '--- Tổng hợp báo cáo ---'
            archiveArtifacts artifacts: 'zap-report.html, *.log', allowEmptyArchive: true
            
            echo '--- Dọn dẹp hệ thống ---'
            sh '''
                pkill -f 'node server.js' || true
                pkill -f 'react-scripts start' || true
                pkill -f 'zap' || true
            '''
        }
    }
}
