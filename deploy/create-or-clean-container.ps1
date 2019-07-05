[CmdletBinding()]
param
(
    [string] [Parameter(Mandatory = $true)]
    $StorageName,
    
    [string] [Parameter(Mandatory = $true)]
    $StorageKey,
    
    [string] [Parameter(Mandatory = $true)]
    $ContainerName
)

try 
{
    Write-Host "Getting context for '$StorageName' storage ..."
    $StorageContext = New-AzureStorageContext -StorageAccountName $StorageName -StorageAccountKey $StorageKey
    
    Write-Host "Checking container '$ContainerName' exists ..."
    $Container = Get-AzureStorageContainer -Context $StorageContext -ErrorAction Stop | where-object {$_.Name -eq $ContainerName}
    
    If($Container) 
    {
        Write-Host "Cleaning container '$ContainerName' ..."
        Get-AzureStorageBlob -Container $ContainerName -Context $StorageContext | Remove-AzureStorageBlob -Context $StorageContext
    }
    Else  
    { 
        Write-Host "Creating container '$ContainerName' ..."
        New-AzureStorageContainer -Name $ContainerName -Context $StorageContext -Permission Blob -ErrorAction Stop
    }
    
    Write-Host "Done"
}
catch 
{
    Write-Host $_.Exception.ToString()
    throw
}