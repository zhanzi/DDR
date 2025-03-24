using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SlzrCrossGate.Core.Models;
using SlzrCrossGate.Core.Service;

namespace SlzrCrossGate.Core
{
    public static class Extensions
    {
        public static TBuilder AddCoreService<TBuilder>(this TBuilder builder) where TBuilder : IHostApplicationBuilder
        {
            builder.Services.AddSingleton<TerminalManager>();



            return builder;
        }
    }
}
