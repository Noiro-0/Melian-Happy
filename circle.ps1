Add-Type -AssemblyName System.Drawing
$srcPath = "d:\Code\Melian-Happy\assets\img\logo.jpg"
$destPath = "d:\Code\Melian-Happy\assets\img\favicon.png"
$img = [System.Drawing.Image]::FromFile($srcPath)
$size = [math]::Min($img.Width, $img.Height)
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(0, 0, $size, $size)
$g.SetClip($path)
$x = ($size - $img.Width) / 2
$y = ($size - $img.Height) / 2
$g.DrawImage($img, $x, $y, $img.Width, $img.Height)
$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Host "Success!"
