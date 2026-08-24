from api.agent import workflow_controller
from dotenv import load_dotenv

load_dotenv()
print(workflow_controller("High fever for 3 days, pain behind the eyes, and red rashes appearing on the body."))