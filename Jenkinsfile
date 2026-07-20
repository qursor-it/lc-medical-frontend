pipeline {
    agent any

    environment {
        DISCORD_WEBHOOK_URL = credentials('discord-webhook-internal')
        FULL_PATH_BRANCH = "${sh(script:'git name-rev --name-only HEAD', returnStdout: true).trim()}"
        BRANCH_NAME = FULL_PATH_BRANCH.substring(FULL_PATH_BRANCH.lastIndexOf('/') + 1, FULL_PATH_BRANCH.length())
        PROJECT_NAME = 'LC-MEDICAL-FRONTEND'
    }

    stages {
        stage('Pre-Build Notification') {
            steps {
                script {
                    discordSend description: "The build process has started for the project.",
                            footer: "#${env.BUILD_NUMBER}",
                                link: env.BUILD_URL,
                                result: "SUCCESS",
                                title: "[${env.PROJECT_NAME}] [${env.BRANCH_NAME}] Build STARTED",
                                webhookURL: env.DISCORD_WEBHOOK_URL
                }
            }
        }

        stage('Deploy Application') {
            steps {
                script {
                    sh '''
                    docker compose up -d --build
                    '''
                }
            }
        }
    }

    post {
        success {
            script {
                discordSend description: "The build process completed successfully.",
                        footer: "#${env.BUILD_NUMBER}",
                        link: env.BUILD_URL,
                        result: "SUCCESS",
                        title: "[${env.PROJECT_NAME}] [${env.BRANCH_NAME}] Build SUCCEDDED",
                        webhookURL: env.DISCORD_WEBHOOK_URL
            }
        }
        failure {
            script {
                discordSend description: "The build process failed. Please check the logs.",
                        footer: "#${env.BUILD_NUMBER}",
                        link: env.BUILD_URL,
                        result: "FAILURE",
                        title: "[${env.PROJECT_NAME}] [${env.BRANCH_NAME}] Build FAILED",
                        webhookURL: env.DISCORD_WEBHOOK_URL
            }
        }
        always {
            cleanWs(cleanWhenNotBuilt: true,
                    deleteDirs: true,
                    disableDeferredWipeout: false,
                    notFailBuild: true,
                    patterns: [])
        }
    }
}
