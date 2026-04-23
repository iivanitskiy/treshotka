$certPath = "certs"
if (-not (Test-Path $certPath)) {
    New-Item -ItemType Directory -Force -Path $certPath
}

$cert = New-SelfSignedCertificate -DnsName "localhost", "127.0.0.1", "::1" -CertStoreLocation "cert:\CurrentUser\My" -KeyExportPolicy Exportable -KeySpec Signature
$certPassword = ConvertTo-SecureString -String "localhost" -Force -AsPlainText

Export-PfxCertificate -Cert $cert -FilePath "$certPath\localhost.pfx" -Password $certPassword

$certPem = "$certPath\localhost.pem"
$keyPem = "$certPath\localhost-key.pem"

$cert | Export-Certificate -FilePath $certPem -Type CERT

Write-Host "Certificate generated: $certPem"
Write-Host "You may need to convert .pfx to .pem using openssl:"
Write-Host "openssl pkcs12 -in $certPath\localhost.pfx -out $keyPem -nocerts -nodes"
Write-Host "openssl pkcs12 -in $certPath\localhost.pfx -out $certPem -nokeys -nodes"