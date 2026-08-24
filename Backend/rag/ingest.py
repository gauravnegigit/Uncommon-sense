from langchain_community.document_loaders import PyPDFLoader 
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.retrievers import BM25Retriever
import pickle 
from pinecone import Pinecone , ServerlessSpec
from langchain_pinecone import PineconeVectorStore
import os
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# load documents 
loader1 = PyPDFLoader("docs/symptoms.pdf")
loader2 = PyPDFLoader("docs/medical_info.pdf")
pages = loader1.load()
pages2 = loader2.load()
pages.extend(pages2)

text_splitter = RecursiveCharacterTextSplitter(chunk_size = 500 , chunk_overlap=50)
chunks = text_splitter.split_documents(pages)

retriever = BM25Retriever.from_documents(chunks)
retriever.k = 4

# saving bm25 chunks
with open("bm25_retriever.pkl" , "wb") as f :
    pickle.dump(retriever , f) 

# saving embeddings in pinecone 
pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index_name = "my-pinecone-index"
if index_name not in pc.list_indexes().names():
    print("yes")
    pc.create_index(
        name=index_name,
        dimension=384,  # Matches OpenAI text-embedding-3-small
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )

PineconeVectorStore.from_documents(chunks , embeddings , index_name)