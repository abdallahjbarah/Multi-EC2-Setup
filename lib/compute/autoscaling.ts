import { Construct } from "constructs";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface AsgConstructProps {
  vpc: ec2.Vpc;
  launchTemplate: ec2.LaunchTemplate;
}

export class AsgConstruct extends Construct {
  public readonly asg: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: AsgConstructProps) {
    super(scope, id);

    this.asg = new autoscaling.AutoScalingGroup(this, "WebServerASG", {
      vpc: props.vpc,
      minCapacity: 2,
      desiredCapacity: 2,
      maxCapacity: 5,
      launchTemplate: props.launchTemplate,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
  }
}
