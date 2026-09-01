@echo off
echo ====================================
echo Starting Cloudflare Tunnel
echo ====================================
echo.
echo Connecting to Cloudflare...
echo Frontend: https://ga.oliveinfo.cn
echo Backend:  https://sql.oliveinfo.cn
echo.
cloudflared tunnel run --token eyJhIjoiN2Q2MTllNGQ0ODFlMzVhMTMxN2NkM2FjZjYwNzNjNDQiLCJzIjoiT0dSaE16ZGpOekF0WVRVMFl5MDBZalF5TFRrNFkySXRNak5qWXpneU1UQTFOVEZtIiwidCI6IjE0N2Q2MTJhLTUwOTUtNGRkNS1hZDdmLWQ1ZWE3MmQ2ODA3ZiJ9