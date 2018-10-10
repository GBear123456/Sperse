[CmdletBinding()]
param
(
    [string] [Parameter(Mandatory = $true)]
    $StorageName,
    
    [string] [Parameter(Mandatory = $true)]
    $StorageKey,

    [string] [Parameter(Mandatory = $true)]
    $ContainerName,

    [string] [Parameter(Mandatory = $true)]
    $ContainerPublicAccessLevel
)

try 
{
    Write-Host "Getting context for '$StorageName' storage ..."
    $StorageContext = New-AzureStorageContext -StorageAccountName $StorageName -StorageAccountKey $StorageKey
    
    Write-Host "Creating container '$ContainerName' in storage '$StorageName' ..."
    New-AzureStorageContainer -Name $ContainerName -Context $StorageContext -Permission $ContainerPublicAccessLevel -ErrorAction Stop
    
    Write-Host "Done"
}
catch 
{
    Write-Host $_.Exception.ToString()
    throw
}
