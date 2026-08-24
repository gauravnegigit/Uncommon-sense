

from langchain_community.retrievers import BM25Retriever
from langchain_classic.retrievers.ensemble import EnsembleRetriever
from langchain_core.prompts import ChatPromptTemplate
from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
import os 
import pickle
from pinecone import Pinecone , ServerlessSpec
from dotenv import load_dotenv

load_dotenv()

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index_name = "my-pinecone-index"

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

index = pc.Index(index_name)
vector_store = PineconeVectorStore(index=index, embedding=embeddings)

def setup_hybrid_retriever():

    # Dense vector retriever
    vector_retriever = vector_store.as_retriever(
            search_type = "similarity" , 
            search_kwargs = {
                "k" : 4, 
            }
    )

    # Sparse retriever
    with open("rag/bm25_retriever.pkl" , "rb") as f:
        bm25_retriever = pickle.load(f)
    bm25_retriever.k = 4

    # Ensemble
    hybrid_retriever = EnsembleRetriever(
            retrievers=[bm25_retriever, vector_retriever],
            weights=[0.3, 0.7]
        )

    return hybrid_retriever
