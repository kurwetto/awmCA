Site at https://michal-korneluk.shop/

The project is a petrol locating web app that displays petrol stations in Ireland that are within your vicinity. When one of the 
petrol station markers is pressed it will display inforatmion regarding the petrol station's brand, city and street name. There 
is also a feature that calculates the distance the user is away from the point they press on the map that isn't a marker and 
tells the user this information. 

The data was gathered using openstreetmaps.org and by querying for the data in overpass, which was then exported and converted 
to a workable geojson. 

I had made the app a PWA which works locally when running with "python manage.py runserver" however when trying to run the app
locally through docker I get an issue with the url "path('', include('pwa.urls'))". I tried very hard to resolve this issue but 
nothing I tried work. I tried to use "re_path", which resulted in the same error in the docker container logs. I eventually figured
maybe a package inside of django-pwa was using "url" instead of "path" which became depricated in pythong 3.9+ so I downgraded to 
python 3.8 to no avail. After playing around more with it, nothing seemed to help I am yet to try downgrading django versions. 

![docker problem](https://github.com/kurwetto/awmCA/assets/71713449/76eb42c6-691a-49e2-b7c9-d2da00c8f384)

The PWA works locally as intended as demonstrated in the presetation on January 2nd 2024. The app is responsive and scales as
intended to the size of mobile devices. 

![myapp](https://github.com/kurwetto/awmCA/assets/71713449/a57644ea-a8d3-4b22-a963-aed6a888f0f2)

After a lot of trouble with this problem I decided to deploy the web app with the "path('', include('pwa.urls'))" line commented
from the urls.py file. This was then pushed to the dockerhub as kornetto21/awmca2.

For the deployment I bought the cheapest domain name from https://www.godaddy.com/en-ie and also created a droplet on digitalocean with docker on Ubuntu. The nameservers from digitalocean were added to the DNS on godaddy as well as the A record on the digitalocean domain settings. This was tested using the ping command from the terminal - the domain name was working as intended redirecting to the drolplet ip. 

![image](https://github.com/kurwetto/awmCA/assets/71713449/9f79fc60-5ee8-4455-9b23-f625f7a79727)

I ssh'd into the droplet and installed nginx. Next I cd'd into the snap directory and created a dockerfile that would be used to build the nginx image. The container was created and ran based on this image, after sshing into it a cert was created using "certbot certonly --nginx". 

The PgAdmin and PostGis docker containers were created and ran as was done locally. 

Next I pulled the image I created I pushed early to the dockerhub "kornetto21/awmca2" and created a container based on this image. I ssh'd into the nginx container and installed nano to created a headers.conf and service.conf file which reflected my domain name and django app container. I then started the django app container and ssh'd into it where i then ran "python manage.py makemigrations", "python manage.py migrate" and "python manage.py collectstatic --no-input". All the commands ran successfully. Upon checking whether all the containers were running using docker ps, the web app was deployed sucessfully.

![image](https://github.com/kurwetto/awmCA/assets/71713449/b61941ca-eeb1-4df3-98b0-d61b52caf235)







