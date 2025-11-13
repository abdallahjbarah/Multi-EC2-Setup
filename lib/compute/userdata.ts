import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface UserDataConstructProps {
  repoUri: string;
  registry: string;
  region: string;
}

export class UserDataConstruct extends Construct {
  public readonly userData: ec2.UserData;

  constructor(scope: Construct, id: string, props: UserDataConstructProps) {
    super(scope, id);

    const { repoUri, registry, region } = props;

    this.userData = ec2.UserData.forLinux();
    this.userData.addCommands(`
set -xe
apt-get update -y
apt-get install -y docker.io awscli nginx
systemctl enable docker && systemctl start docker
systemctl enable nginx && systemctl start nginx
aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${registry}
docker pull ${repoUri}:latest || true
docker stop myapp || true
docker rm myapp || true
docker run -d --restart always --name myapp -p 3000:3000 ${repoUri}:latest
cat <<'NGINXCONF' > /etc/nginx/sites-available/default
server {
    listen 80;
    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
NGINXCONF
systemctl restart nginx
`);
  }
}
