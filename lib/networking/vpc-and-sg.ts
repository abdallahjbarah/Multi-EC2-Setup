import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly ec2Sg: ec2.SecurityGroup;
  public readonly albSg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, "MyVpc", { maxAzs: 2 });

    this.ec2Sg = new ec2.SecurityGroup(this, "Ec2Sg", {
      vpc: this.vpc,
      allowAllOutbound: true,
    });
    this.ec2Sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    this.ec2Sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));

    this.albSg = new ec2.SecurityGroup(this, "AlbSg", {
      vpc: this.vpc,
      allowAllOutbound: true,
    });
    this.albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
  }
}
