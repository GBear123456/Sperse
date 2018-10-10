[CmdletBinding()]
param
(
    [string] [Parameter(Mandatory = $true)]
    $StorageName,
    
    [string] [Parameter(Mandatory = $true)]
    $StorageKey,
    
    [string] [Parameter(Mandatory = $true)]
    $SourceContainerName,
    
    [string] [Parameter(Mandatory = $true)]
    $DestContainerName
)

try 
{
    Write-Host "Getting context for '$StorageName' storage ..."
    $StorageContext = New-AzureStorageContext -StorageAccountName $StorageName -StorageAccountKey $StorageKey
    
    Write-Host "Checking container '$DestContainerName' exists ..."
    $DestContainer = Get-AzureStorageContainer -Context $StorageContext -ErrorAction Stop | where-object {$_.Name -eq $DestContainerName}
    
    If($DestContainer) 
    {
        Write-Host "Cleaning container '$DestContainerName' ..."
        Get-AzureStorageBlob -Container $DestContainerName -Context $StorageContext | Remove-AzureStorageBlob -Context $StorageContext
    }
    Else  
    { 
        Write-Host "Creating container '$DestContainerName' ..."
        New-AzureStorageContainer -Name $DestContainerName -Context $StorageContext -Permission Blob -ErrorAction Stop
    } 
    
    Write-Host "Copying blobs of container '$SourceContainerName' to '$DestContainerName' ..."
    Get-AzureStorageBlob -Container $SourceContainerName -Context $StorageContext | Start-AzureStorageBlobCopy -DestContainer $DestContainerName -Context $StorageContext
    
    Write-Host "Done"
}
catch 
{
    Write-Host $_.Exception.ToString()
    throw
}