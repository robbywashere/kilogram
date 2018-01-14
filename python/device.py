#Android Debug Bridge version 1.0.39
#Revision 3db08f2c6889-android

#import pprint
import sys, json
from os import system
from os import environ
from os.path import join, dirname
from dotenv import load_dotenv
from uiautomator import Device
import string
import random

dotenv_path = join(dirname(__file__),'..', '.env')
load_dotenv(dotenv_path)

def random_string(length=15):
    return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(length))


class IGDevice:
    def __init__(self, device_id):
        self.device_id = device_id
        self.device = Device(device_id)
        self.photo_posted = False

    def open_ig(self):
        cmd = 'adb -s {} shell monkey -p com.instagram.android -c android.intent.category.LAUNCHER 1'.format(self.device_id)
        result = system(cmd)
        if result != 0:
            raise Exception('Error closing ig app for device: {}'.format(self.device_id))

    def close_ig(self):
        cmd = 'adb -s {} shell pm clear  com.instagram.android'.format(self.device_id)
        result = system(cmd)
        if result != 0:
            raise Exception('Error opening ig app for device: {},\n {}'.format(self.device_id, result))



    def clean_slate(self):
        self.close_ig()
        self.clear_photos()
        self.refresh_media()

    def loginAndPhoto(self, username, password):
        self.close_ig()
        self.open_ig()
        self.login(username, password)
        self.photo_mode()

    def login(self, username, password):
        self.device(resourceId='com.instagram.android:id/log_in_button').click()
        self.device(resourceId='com.instagram.android:id/login_username').set_text(username)
        self.device(resourceId='com.instagram.android:id/password').set_text(password)
        self.device(resourceId='com.instagram.android:id/next_button').click()

    def refresh_media(self):
        cmd = 'adb -s {} shell am broadcast -a android.intent.action.MEDIA_MOUNTED -d file:///sdcard'.format(self.device_id)
        result = system(cmd)
        if result != 0:
            raise Exception('Error refreshing media for device: {}, \n {}'.format(self.device_id, result))


    def dump(self):
        self.device.dump('hierarchy.xml')

    def clear_photos(self):
        dirs = ["/storage/emulated/legacy/Pictures/Instagram/*", "/storage/emulated/legacy/DCIM/Camera/*"]

        for dir in dirs:
            cmd = "adb shell rm {}".format(dir)
            # TODO: adb ls to check for files?
            result = system(cmd)
            if result != 0:
                raise Exception('Error removing media from device: {}, \n {}'.format(self.device_id, result))

    def describe(self, txt):
        self.device(resourceId='com.instagram.android:id/caption_text_view').set_text(txt)

    def push_photo(self, local, storage_name = None):
        storage_name = storage_name if storage_name != None else random_string() 
        remote = '/storage/emulated/legacy/DCIM/Camera/{}.jpg'.format(storage_name)
        cmd = "adb push '{}' '{}'".format(local,remote)
        result = system(cmd)
        if result != 0:
            raise Exception('Error pushing media to device: {}, \n {}'.format(self.device_id, result))

    def photo_mode(self):
        self.device(description='Camera',index=2).click()


    def photo_dance(self, desc=""):
        self.device(description='Camera',index=2).click()
        self.device(text='Next').click()
        self.device(text='Next').click()
        self.describe(desc)
        myDevice.device(text='Share').click()
        self.photo_posted = True

    def full_dance(self, username, password, localfile,  desc = ""):
        if localfile is None:
            if objectname is None:
                raise Exception('Error no localname or objectname given')
            localfile = object_download(objectname) 

        myDevice.clean_slate()
        myDevice.open_ig()
        myDevice.push_photo(localfile)
        myDevice.refresh_media()
        myDevice.login(username, password)
        myDevice.photo_dance(desc)
        myDevice.clean_slate()

    def get(self, method):
        return getattr(self,method) 

for line in sys.stdin:
    stdinput = json.loads(line)

try:
    stdinput 
except NameError:
    print "--- NO INPUT ---"
    print json.dumps({ "success": False, "error": "noinput" });

else:
    error = None
    if stdinput['method'] == "echo":
        print json.dumps(stdinput)
    else:
        try:
            myDevice = IGDevice(stdinput['deviceId'])
            if stdinput['method'] == "raise_except":
                raise Exception('exception!')
            myDevice.device.watcher("NotNow").when(text="Not Now",resourceId="com.instagram.android:id/button_negative").press.back()
            myDevice.get(input['method'])(**input['args']);
            
        except:
            error = str(sys.exc_info()[0])

        photo_posted = myDevice.get('photo_posted')
        j = { "success": photo_posted, "error": error }
        print json.dumps(j)




