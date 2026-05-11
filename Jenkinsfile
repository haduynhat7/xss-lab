pipeline {
    agent any

    tools {
        nodejs 'node' 
    }

    stages {
        stage('1. Setup & Clean Workspace') {
            steps {
                echo '--- Dọn dẹp không gian làm việc ---'
                sh 'rm -rf zap-report.html *.log'
                
                dir('backend') { sh 'npm install' }
                dir('frontend') { sh 'npm install' }
            }
        }

        stage('2. Security Scan (Snyk SCA & SAST)') {
            steps {
                echo '--- Snyk rà soát thư viện (SCA) và mã nguồn (SAST) ---'
                
                // 1. Quét thư viện (SCA) cho cả Frontend và Backend
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

                // 2. Quét mã nguồn (SAST) - Thay thế hoàn toàn CodeQL
                // Lệnh này tìm lỗi XSS, SQLi trực tiếp trong code bạn viết
                sh 'snyk code test --fail-on=all || true'
            }
        }

        stage('3. DAST Scan (OWASP ZAP)') {
            steps {
                script {
                    echo '--- Chuẩn bị OWASP ZAP ---'
                    sh '''
                        if [ ! -d "ZAP_2.16.0" ]; then
                            echo "Đang tải OWASP ZAP..."
                            wget -qO zap.tar.gz https://github.com
                            tar -xzf zap.tar.gz
                            rm zap.tar.gz
                        fi
                    '''

                    echo '--- Khởi động Lab và quét XSS ---'
                    sh 'cd backend && nohup node server.js > ../backend.log 2>&1 &'
                    sh 'cd frontend && nohup npm start > ../frontend.log 2>&1 &'
                    
                    echo "Chờ dịch vụ khởi động (tối đa 60s)..."
                    sh 'timeout 60s bash -c "until curl -s localhost:3000 > /dev/null; do sleep 5; done"'

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
            // Đã bỏ file sarif của CodeQL, chỉ giữ lại ZAP và Log
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
