# mercadoandino-app

Aplicación de prueba de la **HT-05: Plataforma escalable para MercadoAndino en AWS Learner Lab**
(PIAD-626 Tecnología Cloud con AWS, SENATI).

- `server.js`: servidor Express con `/`, `/health`, `/api/upload-url` (URL prefirmada de S3 válida 5 minutos) y `/subir` (página de prueba para subir una foto).
- `appspec.yml` y `scripts/`: despliegue automatizado con AWS CodeDeploy (ApplicationStop, AfterInstall, ApplicationStart y ValidateService).
- `infra/`: archivos usados en el lab (User data del Launch Template, política, CORS y ciclo de vida del bucket, agente de CloudWatch y dashboard).

Arquitectura: S3 (fotos) + Application Load Balancer + Auto Scaling Group (Amazon Linux 2023, t3.micro) + CloudWatch y SNS + CodeDeploy, en us-east-1.
Las credenciales llegan desde `LabInstanceProfile`; no hay llaves en el código.

Autor: Diaz Castro Alvaro Cristofer
