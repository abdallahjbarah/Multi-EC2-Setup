import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";

export class EcrRepositoryConstruct extends Construct {
  public readonly repo: ecr.Repository;
  public readonly repoUri: string;
  public readonly registry: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.repo = new ecr.Repository(this, "MyAppRepo", {
      repositoryName: "myapp",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.repoUri = this.repo.repositoryUri;
    this.registry = this.repoUri.split("/")[0];
  }
}
