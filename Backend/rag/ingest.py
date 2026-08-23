from langchain_community.document_loaders import PyPDFLoader 
from langchain_text_splitters import RecursiveCharacterTextSplitter

# load documents 
loader1 = PyPDFLoader("docs/symptoms.pdf")
loader2 = PyPDFLoader("docs/medical_info.pdf")
pages = loader1.load()
pages2 = loader2.load()
pages.extend(pages2)

text_splitter = RecursiveCharacterTextSplitter(chunk_size = 500 , chunk_overlap=50)
chunks = text_splitter.split_documents(pages)