import sys, json
import traceback
from os.path import join, dirname

from igdevice import IGDevice

for line in sys.stdin:
    stdinput = json.loads(line)

try:
    stdinput 
except NameError:
    #print("--- NO INPUT ---")
    print(json.dumps({ "success": False, "error": "no input", "code": 400 }));

else:
    error = None
    code = 200
    if stdinput['method'] == "echo":
        print(json.dumps(stdinput))
    else:
        try:
            myDevice = IGDevice(stdinput['deviceId'])
            if stdinput['method'] == "raise_except":
                code = 418
                raise Exception('exception!')
            myDevice.setup()
            myDevice.get(stdinput['method'])(**stdinput['args'])
            
        except:
            error = traceback.format_exc() 
            
        myDevice.teardown()
        photo_posted = myDevice.get('photo_posted')
        j = { "success": photo_posted, "error": error, "code": code }
        print(json.dumps(j))




