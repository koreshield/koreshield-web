import os
import re

target_dir = 'src'

replacements = [
    # Sentences with lists
    (r',\s*DeepSeek', ''),
    (r'DeepSeek,\s*', ''),
    (r'\s*/\s*DeepSeek', ''),
    (r'DeepSeek\s*/\s*', ''),
    (r'\band DeepSeek\b', ''),
    (r',\s*and DeepSeek', ''),

    # Arrays
    (r",\s*'DeepSeek'", ''),
    (r"'DeepSeek',\s*", ''),
    (r',?\s*"deepseek"', ''),
    (r",\s*'deepseek'", ''),
    
    # Specific code files
    (r"model=['\"]deepseek-chat['\"]", "model='gpt-4o'"),
    (r"model:\s*['\"]deepseek-chat['\"]", "model: 'gpt-4o'"),
    (r"<option value=\"deepseek\">DeepSeek</option>", ""),
    
    # Changelog specifics
    (r"DeepSeek, Gemini, and Azure OpenAI", "Gemini, and Azure OpenAI"),
    (r"OpenAI, Anthropic, and DeepSeek", "OpenAI and Anthropic"),
    (r"OpenAI, Anthropic, and DeepSeek out of the box.", "OpenAI and Anthropic out of the box."),
    
    # Config/Env variables
    (r".*DEEPSEEK_API_KEY.*", ""),
    
    # Architecture and other places
    (r"deepseek:\s*ProviderStatus;", ""),
    
    # Docs lists
    (r"\| `deepseek-\*` \| DeepSeek \|", ""),
    (r"- \[DeepSeek\]\(.*deepseek\.mdx\)", ""),
]

for root, _, files in os.walk(target_dir):
    for filename in files:
        if filename.endswith(('.ts', '.tsx', '.mdx', '.json')):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for pattern, repl in replacements:
                content = re.sub(pattern, repl, content)
                
            # Quick fixes for any leftover "DeepSeek"
            content = content.replace("DeepSeek", "")
                
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {filepath}")
