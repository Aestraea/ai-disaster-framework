# Use Python 3.10 as base image
FROM python:3.10

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application file
COPY app.py .

# Expose port used by Hugging Face Spaces
EXPOSE 7860

CMD ["python", "app.py"]
