using System;
using Abp.AspNetCore;
using Abp.Castle.Logging.Log4Net;
using Abp.Hangfire;
using Abp.Owin;
using Abp.Timing;
using Castle.Facilities.Logging;
using Hangfire;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Cors.Internal;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Owin.Cors;
using Sperse.CRM.Authorization;
using Sperse.CRM.Web.Configuration;
using Sperse.CRM.Web.MultiTenancy;
using Sperse.CRM.Web.Owin;
using Owin;
using PaulMiami.AspNetCore.Mvc.Recaptcha;

namespace Sperse.CRM.Web.Startup
{
    public class Startup
    {
        private const string DefaultCorsPolicyName = "localhost";

        private readonly IConfigurationRoot _appConfiguration;

        public Startup(IHostingEnvironment env)
        {
            _appConfiguration = env.GetAppConfiguration();
        }

        public IServiceProvider ConfigureServices(IServiceCollection services)
        {
            //MVC
            services.AddMvc(options =>
            {
                options.Filters.Add(new CorsAuthorizationFilterFactory(DefaultCorsPolicyName));
            });

            //Configure CORS!
            services.AddCors(options =>
            {
                options.AddPolicy(DefaultCorsPolicyName, p =>
                {
                    p.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod();
                });
            });

            //Swagger - Enable this line and the related lines in Configure method to enable swagger UI
            services.AddSwaggerGen();

            //Recaptcha
            services.AddRecaptcha(new RecaptchaOptions
            {
                SiteKey = _appConfiguration["Recaptcha:SiteKey"],
                SecretKey = _appConfiguration["Recaptcha:SecretKey"]
            });

            //Configure Abp and Dependency Injection
            return services.AddAbp<CRMWebHostModule>(options =>
            {
                //Configure Log4Net logging
                options.IocManager.IocContainer.AddFacility<LoggingFacility>(
                    f => f.UseAbpLog4Net().WithConfig("log4net.config")
                );
            });
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            app.UseAbp(); //Initializes ABP framework.

            app.UseCors(DefaultCorsPolicyName); //Enable CORS!

            app.UseTenantIdAccessorInitialization();

            AuthConfigurer.Configure(app, _appConfiguration);

            app.UseStaticFiles();

            //Integrate to OWIN
            app.UseAppBuilder(ConfigureOwinServices);

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "defaultWithArea",
                    template: "{area}/{controller=Home}/{action=Index}/{id?}");

                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });

            // Enable middleware to serve generated Swagger as a JSON endpoint
            app.UseSwagger();
            // Enable middleware to serve swagger-ui assets (HTML, JS, CSS etc.)
            app.UseSwaggerUi(); //URL: /swagger/ui
        }

        private static void ConfigureOwinServices(IAppBuilder app)
        {
            app.Properties["host.AppName"] = "CRM";

            app.UseAbp();

            app.Map("/signalr", map =>
            {
                map.UseCors(CorsOptions.AllowAll);
                var hubConfiguration = new HubConfiguration
                {
                    EnableJSONP = true
                };
                map.RunSignalR(hubConfiguration);
            });

            //Enable it to use HangFire dashboard (use only if it's enabled in CRMWebCoreModule)
            //app.UseHangfireDashboard("/hangfire", new DashboardOptions
            //{
            //    Authorization = new[] { new AbpHangfireAuthorizationFilter(AppPermissions.Pages_Administration_HangfireDashboard) }
            //});
        }
    }
}
