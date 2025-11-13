import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as cdk from "aws-cdk-lib";

export interface AlbConstructProps {
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  asg: autoscaling.AutoScalingGroup;
}

export class AlbConstruct extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    this.alb = new elbv2.ApplicationLoadBalancer(this, "MyALB", {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.securityGroup,
    });

    const listener = this.alb.addListener("Listener", { port: 80, open: true });

    listener.addTargets("TargetGroup", {
      port: 80,
      targets: [props.asg],
      healthCheck: { path: "/", interval: cdk.Duration.seconds(30) },
    });
  }
}
