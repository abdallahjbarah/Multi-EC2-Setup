import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";

export interface LaunchTemplateProps {
  securityGroup: ec2.SecurityGroup;
  role: iam.Role;
  userData: ec2.UserData;
}

export class LaunchTemplateConstruct extends Construct {
  public readonly launchTemplate: ec2.LaunchTemplate;

  constructor(scope: Construct, id: string, props: LaunchTemplateProps) {
    super(scope, id);

    const ubuntuAmi = ec2.MachineImage.fromSsmParameter(
      "/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2",
      { os: ec2.OperatingSystemType.LINUX }
    );

    this.launchTemplate = new ec2.LaunchTemplate(
      this,
      "WebServerLaunchTemplate",
      {
        instanceType: new ec2.InstanceType("t3.micro"),
        machineImage: ubuntuAmi,
        securityGroup: props.securityGroup,
        role: props.role,
        userData: props.userData,
      }
    );
  }
}
