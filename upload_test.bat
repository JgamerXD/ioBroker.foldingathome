echo Hello
call npm run-script build
scp *.json raspberrypi4:~/docker/smarthome/iobroker/node_modules/iobroker.foldingathome/
scp *.js raspberrypi4:~/docker/smarthome/iobroker/node_modules/iobroker.foldingathome/
scp *.ts raspberrypi4:~/docker/smarthome/iobroker/node_modules/iobroker.foldingathome/
scp -r .\admin\ raspberrypi4:~/docker/smarthome/iobroker/node_modules/iobroker.foldingathome/
scp -r .\build\ raspberrypi4:~/docker/smarthome/iobroker/node_modules/iobroker.foldingathome/
echo Upload done!
ssh raspberrypi4 "docker exec smarthome_iob /bin/sh -c 'iobroker upload foldingathome; iobroker restart foldingathome.0'"
echo Restart done!