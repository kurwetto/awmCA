def run():
    from .models import Pub, Artist

    # Update the first pub
    pub = Pub.objects.get(name='The Leopardstown Inn')
    artist = Artist.objects.get(artistName='Shakira')
    pub.artist = artist
    pub.songURL = "/media/songs/Shakira_-_Hips_Dont_Lie_Lyrics_ft._Wyclef_Jean.mp3"
    pub.save()

    # Update the second pub
    pub = Pub.objects.get(name='Ollie\'s Lounge & Bar')
    artist = Artist.objects.get(artistName='PurrpleCat')
    pub.artist = artist
    pub.songURL = "/media/songs/Purrple_Cat_-_Sea_of_Stars_2.mp3"
    pub.save()

    # Update the third pub
    pub = Pub.objects.get(name='Brickyard')
    artist = Artist.objects.get(artistName="None")
    pub.artist = artist
    pub.songURL = ""
    pub.save()
    print('Successfully updated pub data')
