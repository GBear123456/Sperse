## ASP.NET ZERO - Angular 2 UI

This is Angular 2 UI for AspNet Zero. It's in PREVIEW state and is constantly being improved and changed.
So, don't use it in production, but you can test it and check source to prepare to the coming release.

### Prerequirements

*ASP.NET Core (Windows (x64) Installer - .NET Core 1.1.1 runtime (Current))
https://www.microsoft.com/net/download/core#/runtime

* nodejs + npm
https://nodejs.org/dist/v6.9.5/node-v6.9.5-x64.msi

* Yarn
https://yarnpkg.com/en/docs/install#windows-tab

* angular-cli v1.0.0-beta.17 (tested in this version, but may work in later versions too).

* typescript 2.0 (v2.1 recommended).
https://www.microsoft.com/en-us/download/details.aspx?id=48593

### IDE

Project is IDE and OS independent. That means you can develop in Windows/Linux/Mac with any editor.
We developed it with Visual Studio 2015 and Visual Studio Code.
We are best comfortable with Visual Studio 2015 with Resharper 2016.3 EAP.

### How To Run?

UI uses AspNet Zero (ASP.NET Core version) as backend. So, you should first run it:

* Open AspNet Zero AspNet Core project in Visual Studio.
* Set ``.Web.Host`` as startup project.
* Go to the root folder of EntityFramework project and run UpdateDB.cmd.
* Run the application. You will see the Swagger UI (https://www.aspnetzero.com/Documents/Development-Guide-Core#swagger-ui).
  http://localhost:7000

Once server side is ready, you can run the Angular2 application:

* Go to root folder of the Angular2 project (the folder contains package.json file) and run ``yarn`` from command line one time to restore all packages (or RestorePackages.cmd).
* Run ``npm start`` from command line to run angular-cli server. Wait webpack to finish it's work.
* Visit ``http://localhost:7200`` in your browser.
  User: admin
  Password: Qwertyuiop1