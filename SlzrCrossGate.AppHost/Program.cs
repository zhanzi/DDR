var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddProject<Projects.SlzrCrossGate_ApiService>("apiservice");

builder.AddProject<Projects.SlzrCrossGate_WebAdmin>("webadmin").WithExternalHttpEndpoints()
    .WithReference(apiService)
    .WaitFor(apiService);

builder.Build().Run();
