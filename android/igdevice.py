
import sys, json
from os import system
from os.path import join, dirname
from uiautomator import Device
import string
import random
import re

def random_string(length=15):
    return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(length))



class IGDevice:
    def __init__(self, device_id):
        self.device_id = device_id
        self.device = Device(device_id)
        self.completed = False
        self.body = None


    def waitForLogin(self, timeout=10):
        count = 0
        while True:
            try: 
                if self.device(resourceId="com.instagram.android:id/alertTitle").wait.exists(timeout=0):
                    text = self.device(resourceId="com.instagram.android:id/alertTitle").text
                    if re.search('incorrect', text, re.IGNORECASE):
                        result = { 'login': False, 'type': 'creds_error', 'msg': text }

                    else:
                        result = { 'login': False, 'type': 'alert_error', 'msg': text }

                    break
                if self.device(description='Home').wait.exists(timeout=0):
                    result = { 'login': True, 'type': 'login', 'msg': 'login' }
                    break
                if count == timeout:
                    result = { 'login': False, 'type': 'timeout_error', 'msg': 'timeout' }
                    break
            except:
                text = traceback.format_exc() 
                result = { 'login': False, 'type': 'error', 'msg': text }
                break


            time.sleep(1)
            count += 1

        return result




    def wake(self):
        if self.device.screen == "off":
            self.device.wakeup()

    def sleep(self):
        if self.device.screen == "on":
            self.device.sleep()


    def teardown(self):
        self.sleep()

    def setup(self):
        self.wake()
        #TODO: Add network error handling
        self.device.watcher("NotNow").when(text="Not Now",resourceId="com.instagram.android:id/button_negative").press.back()
        #self.register_network_error_handler()
        #self.device.watcher("Error").when(text="Error",resourceId="com.instagram.android:id/alertTitle")

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
        self.login(username, password)
        self.photo_mode()

    def login(self, username, password):
        self.device(resourceId='com.instagram.android:id/log_in_button').click()
        self.device(resourceId='com.instagram.android:id/login_username').set_text(username)
        self.device(resourceId='com.instagram.android:id/password').set_text(password)
        self.device(resourceId='com.instagram.android:id/next_button').click.wait()


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
        storage_name = storage_name if storage_name != None else random_string() #huh? perhaps you should use this for selection?
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
        self.device(text='Share').click()

    #def handle_login:
    def verify_ig_dance(self, username, password): 
        self.clean_slate()
        self.open_ig()
        self.login(username, password)

        login_result = self.waitForLogin()
        self.body = login_result
        self.completed = True


    def full_dance(self, username, password, localfile,  desc = ""):
        if localfile is None:
            if objectname is None:
                raise Exception('Error no localname or objectname given')
            localfile = object_download(objectname) 

        self.clean_slate()
        self.open_ig()
        self.push_photo(localfile)
        self.refresh_media()
        self.login(username, password)
        login_result = self.waitForLogin()
        if login_result['login']:
            self.photo_dance(desc)
            self.completed = True
            self.clean_slate()
        else:
            self.body = login_result
            self.completed = False
            #raise Exception('Unable to login user')

    def get(self, method):
        return getattr(self,method) 
