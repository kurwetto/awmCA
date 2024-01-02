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

For the deployment I bought a domain name from 




