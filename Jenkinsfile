pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Código baixado com sucesso!'
            }
        }
        
        stage('Build') {
            steps {
                echo 'Projeto sem build - apenas HTML/CSS/JS'
                // Adicione aqui comandos se precisar
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploy realizado com sucesso!'
                // Adicione aqui seu deploy
            }
        }
    }
}