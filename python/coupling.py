import sys, json
from os.path import join, dirname

from igdevice import IGDevice

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
            myDevice.setup()
            myDevice.get(input['method'])(**input['args'])
            
        except:
            error = str(sys.exc_info()[0])

        myDevice.tear_down()
        photo_posted = myDevice.get('photo_posted')
        j = { "success": photo_posted, "error": error }
        print json.dumps(j)




