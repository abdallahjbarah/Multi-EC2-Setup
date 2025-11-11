import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";

export class MultipleEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, "MyVpc", { maxAzs: 2 });

    // Security groups
    const ec2Sg = new ec2.SecurityGroup(this, "Ec2Sg", {
      vpc,
      allowAllOutbound: true,
    });
    ec2Sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow HTTP");
    ec2Sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), "Allow SSH");

    const albSg = new ec2.SecurityGroup(this, "AlbSg", {
      vpc,
      allowAllOutbound: true,
    });
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP to ALB"
    );

    // AMI (Ubuntu 22.04 via SSM parameter)
    const ubuntuAmi = ec2.MachineImage.fromSsmParameter(
      "/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id",
      { os: ec2.OperatingSystemType.LINUX }
    );

    // ECR repository
    const repo = new ecr.Repository(this, "MyAppRepo", {
      repositoryName: "myapp",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    repo.addLifecycleRule({ maxImageCount: 30 });

    const repoUri = repo.repositoryUri;
    const registry = repoUri.split("/")[0];

    // IAM role for EC2 instances
    const role = new iam.Role(this, "EC2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      description: "Role for EC2 instances to pull Docker images from ECR",
    });
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonEC2ContainerRegistryReadOnly"
      )
    );
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    // UserData
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "set -xe",

      // Update OS and install Docker + Nginx + AWS CLI
      "apt-get update -y",
      "apt-get install -y docker.io awscli nginx git",

      // Enable & start services
      "systemctl enable docker && systemctl start docker",
      "systemctl enable nginx && systemctl start nginx",

      // Login to ECR using instance role
      `aws ecr get-login-password --region ${this.region} | docker login --username AWS --password-stdin ${registry}`,

      // Pull latest container image
      `docker pull ${repoUri}:latest || true`,

      // Stop and remove old container if it exists
      "docker stop myapp || true",
      "docker rm myapp || true",

      // Run container on port 3000
      `docker run -d --restart always --name myapp -p 3000:3000 ${repoUri}:latest`,

      // Configure Nginx on EC2 host (reverse proxy 80 -> 3000)
      `cat <<'NGINXCONF' > /etc/nginx/sites-available/default
server {
    listen 80;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXCONF`,

      // Restart Nginx to apply configuration
      "systemctl restart nginx",

      // Install and run Watchtower for automatic updates
      `docker run -d --name watchtower --restart always -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower myapp --interval 30`
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      "WebServerLaunchTemplate",
      {
        instanceType: new ec2.InstanceType("t3.micro"),
        machineImage: ubuntuAmi,
        securityGroup: ec2Sg,
        role: role,
        userData: userData,
      }
    );

    // Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, "WebServerASG", {
      vpc,
      minCapacity: 2,
      desiredCapacity: 2,
      maxCapacity: 5,
      launchTemplate,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Grant pull access to ECR
    repo.grantPull(role);

    // ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, "MyALB", {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
    });

    const listener = alb.addListener("Listener", { port: 80, open: true });
    listener.addTargets("TargetGroup", {
      port: 80, // host port (Nginx)
      targets: [asg],
      healthCheck: { path: "/", interval: cdk.Duration.seconds(30) },
    });

    // Outputs
    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: alb.loadBalancerDnsName,
    });
    new cdk.CfnOutput(this, "EcrRepoUri", { value: repoUri });
    new cdk.CfnOutput(this, "ASGName", { value: asg.autoScalingGroupName });
  }
}
