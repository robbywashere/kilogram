import sys, json
import traceback
from os.path import join, dirname

from igdevice import IGDevice

for line in sys.stdin:
    stdinput = json.loads(line)

try:
    stdinput 
except NameError:
    print(json.dumps({ "success": False, "error": "no input" }));

else:
    error = None
    if stdinput['method'] == "echo":
        print(json.dumps(stdinput))
    else:
        try:
            myDevice = IGDevice(stdinput['deviceId'])
            if stdinput['method'] == "raise_except":
                raise Exception('exception!')
            myDevice.setup()
            myDevice.get(stdinput['method'])(**stdinput['args'])

        except:
            error = traceback.format_exc() 

        myDevice.teardown()


        resultPayload = { 
            "body": myDevice.body,
            "success": myDevice.completed, 
            "error": error, 
        }
        print(json.dumps(resultPayload))




