import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { NetworkingConstruct } from "./networking/vpc-and-sg";
import { EcrRepositoryConstruct } from "./registry/ecr-repo";
import { InstanceRoleConstruct } from "./compute/instance-role";
import { UserDataConstruct } from "./compute/userdata";
import { LaunchTemplateConstruct } from "./compute/launchtemplate";
import { AsgConstruct } from "./compute/autoscaling";
import { AlbConstruct } from "./loadbalancer/alb";

export class MultipleEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const net = new NetworkingConstruct(this, "Networking");
    const repo = new EcrRepositoryConstruct(this, "Repository");
    const role = new InstanceRoleConstruct(this, "InstanceRole");

    const ud = new UserDataConstruct(this, "UserData", {
      repoUri: repo.repoUri,
      registry: repo.registry,
      region: this.region,
    });

    const lt = new LaunchTemplateConstruct(this, "LaunchTemplate", {
      securityGroup: net.ec2Sg,
      role: role.role,
      userData: ud.userData,
    });

    const asg = new AsgConstruct(this, "ASG", {
      vpc: net.vpc,
      launchTemplate: lt.launchTemplate,
    });

    repo.repo.grantPull(role.role);

    const alb = new AlbConstruct(this, "LoadBalancer", {
      vpc: net.vpc,
      securityGroup: net.albSg,
      asg: asg.asg,
    });

    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: alb.alb.loadBalancerDnsName,
    });
    new cdk.CfnOutput(this, "EcrRepoUri", { value: repo.repoUri });
    new cdk.CfnOutput(this, "ASGName", { value: asg.asg.autoScalingGroupName });
  }
}
