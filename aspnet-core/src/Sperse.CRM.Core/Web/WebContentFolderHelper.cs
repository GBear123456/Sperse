using System;
using System.IO;
using System.Linq;

namespace Sperse.CRM.Web
{
    /// <summary>
    /// This class is used to find root path of the web project in;
    /// unit tests (to find views) and entity framework core command line commands (to find conn string).
    /// </summary>
    public static class WebContentDirectoryFinder
    {
        public static string CalculateContentRootFolder()
        {
            var coreAssemblyDirectoryPath = Path.GetDirectoryName(typeof(CRMCoreModule).Assembly.Location);
            if (coreAssemblyDirectoryPath == null)
            {
                throw new ApplicationException("Could not find location of Sperse.CRM.Core assembly!");
            }

            var directoryInfo = new DirectoryInfo(coreAssemblyDirectoryPath);
            while (!DirectoryContains(directoryInfo.FullName, "Sperse.CRM.sln"))
            {
                if (directoryInfo.Parent == null)
                {
                    throw new ApplicationException("Could not find content root folder!");
                }

                directoryInfo = directoryInfo.Parent;
            }

            var webMvcFolder = Path.Combine(directoryInfo.FullName, @"src\Sperse.CRM.Web.Mvc");
            if (Directory.Exists(webMvcFolder))
            {
                return webMvcFolder;
            }

            var webHostFolder = Path.Combine(directoryInfo.FullName, @"src\Sperse.CRM.Web.Host");
            if (Directory.Exists(webHostFolder))
            {
                return webHostFolder;
            }

            throw new ApplicationException("Could not find root folder of the web project!");
        }

        private static bool DirectoryContains(string directory, string fileName)
        {
            return Directory.GetFiles(directory).Any(filePath => string.Equals(Path.GetFileName(filePath), fileName));
        }
    }
}
