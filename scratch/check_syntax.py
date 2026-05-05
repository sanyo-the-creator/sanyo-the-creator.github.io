
import sys

def count_tags(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Very simple tag counter, ignores comments and strings (mostly)
    open_divs = content.count('<div')
    close_divs = content.count('</div>')
    
    print(f"File: {filename}")
    print(f"Opening <div: {open_divs}")
    print(f"Closing </div>: {close_divs}")
    
    # Also check { and }
    open_braces = content.count('{')
    close_braces = content.count('}')
    print(f"Opening {{: {open_braces}")
    print(f"Closing }}: {close_braces}")

if __name__ == "__main__":
    count_tags(sys.argv[1])
