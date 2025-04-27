import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';

// Set worker source
GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('chunks/pdf.worker.min.js');

// Function to escape special regex characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Common technical skills to look for, organized by category
const TECHNICAL_SKILLS = {
  programming: [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust',
    'Swift', 'Kotlin', 'PHP', 'Perl', 'Scala', 'Haskell', 'Elixir', 'Clojure',
    'Dart', 'Lua', 'R', 'MATLAB', 'Groovy', 'F#', 'Erlang', 'Objective-C', 'Shell'
  ],
  frameworks: [
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
    'Laravel', 'Ruby on Rails', 'ASP.NET', 'Next.js', 'Nuxt.js', 'Svelte',
    'FastAPI', 'NestJS', 'Gatsby', 'Phoenix', 'Meteor', 'Symfony', 'CakePHP',
    'Blazor', 'Quarkus', 'Micronaut', 'Flutter', 'SwiftUI', 'Jetpack Compose'
  ],
  databases: [
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'DynamoDB',
    'Oracle', 'SQLite', 'Neo4j', 'Firebase', 'CosmosDB', 'MariaDB', 'CouchDB',
    'Elasticsearch', 'Snowflake', 'BigQuery', 'DB2', 'HBase', 'InfluxDB'
  ],
  cloud: [
    'AWS', 'Azure', 'GCP', 'AWS Lambda', 'Docker', 'Kubernetes', 'Terraform', 'Ansible',
    'Jenkins', 'GitHub Actions', 'CI/CD', 'Serverless', 'Lambda', 'EC2', 'S3',
    'RDS', 'CloudFront', 'VPC', 'IAM', 'CloudFormation', 'Elastic Beanstalk',
    'Athena', 'Redshift', 'Kinesis', 'SNS', 'SQS', 'Cognito', 'Route 53', 'Glue',
    'Step Functions', 'Fargate', 'EKS', 'CloudWatch', 'CloudTrail', 'OpenSearch',
    'AppSync', 'Aurora', 'ElastiCache', 'EMR', 'EventBridge', 'Lake Formation',
    'SageMaker', 'Bedrock', 'Nova', 'QuickSight', 'GuardDuty', 'Secrets Manager',
    'OpenShift', 'Pulumi', 'GitLab CI', 'CircleCI', 'Prometheus', 'Grafana',
    'AKS', 'GKE', 'Heroku', 'DigitalOcean', 'Cloudfront', 'Cloudfare'
  ],
  web: [
    'HTML', 'CSS', 'SASS', 'LESS', 'Bootstrap', 'Tailwind', 'Webpack',
    'Babel', 'npm', 'yarn', 'REST', 'GraphQL', 'WebSocket', 'Vite', 'Rollup',
    'ESLint', 'Prettier', 'Styled-Components', 'Material-UI', 'Chakra UI',
    'gRPC', 'JSON', 'XML', 'AJAX'
  ],
  methodologies: [
    'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD', 'OOP', 'Functional Programming',
    'Microservices', 'MVC', 'Design Patterns', 'DevOps', 'SAFe', 'Lean',
    'Domain-Driven Design', 'Event-Driven Architecture', 'CQRS', 'Pair Programming',
    'Waterfall', 'CI/CD Pipelines', 'Monolithic Architecture'
  ],
  testing: [
    'Testing', 'Unit Testing', 'Integration Testing', 'Jest', 'Mocha',
    'Cypress', 'Selenium', 'Test-Driven Development', 'Chai', 'Enzyme',
    'Playwright', 'Puppeteer', 'Vitest', 'JUnit', 'TestNG', 'Postman',
    'Mockito', 'SpecFlow', 'Load Testing', 'Stress Testing'
  ],
  security: [
    'Security', 'Authentication', 'Authorization', 'OAuth', 'JWT',
    'SSL/TLS', 'Encryption', 'Penetration Testing', 'OpenID Connect',
    'SAML', 'Hashing', 'SQL Injection', 'XSS', 'CSRF', 'Secure Coding',
    'OWASP', 'Keycloak', 'IdentityServer', 'Zero Trust', 'GDPR Compliance'
  ],
  data: [
    'Machine Learning', 'Data Science', 'AI', 'TensorFlow', 'PyTorch',
    'Pandas', 'NumPy', 'Data Analysis', 'Big Data', 'Hadoop', 'Spark',
    'Scikit-learn', 'Keras', 'R', 'Jupyter', 'Tableau', 'Power BI',
    'Data Visualization', 'ETL', 'Airflow', 'Kafka', 'Deep Learning',
    'Natural Language Processing', 'Computer Vision'
  ],
  tools: [
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence',
    'VS Code', 'IntelliJ', 'Eclipse', 'Postman', 'Swagger', 'Docker Desktop',
    'PyCharm', 'WebStorm', 'Xcode', 'Android Studio', 'Trello', 'Asana',
    'Slack', 'Figma', 'Zeplin', 'Notion', 'Insomnia', 'Lens', 'Maven', 'Gradle'
  ]
};

interface Skill {
  name: string;
  confidence: number;
  category: string;
}

export async function processPDF(file: File): Promise<Skill[]> {
  try {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Read the file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    
    // Extract text from all pages
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + ' ';
    }
    
    text = text.toLowerCase();
    
    // Extract skills
    const extractedSkills: Skill[] = [];
    
    // Process each category of skills
    Object.entries(TECHNICAL_SKILLS).forEach(([category, skills]) => {
      skills.forEach(skill => {
        try {
          // Create regex pattern that matches the skill word boundary
          // Escape special characters in the skill name
          const escapedSkill = escapeRegExp(skill.toLowerCase());
          const regex = new RegExp(`\\b${escapedSkill}\\b`, 'g');
          const matches = text.match(regex);
          
          if (matches) {
            // Calculate confidence based on:
            // 1. Number of occurrences (max 0.6)
            // 2. Position in document (first half gets bonus)
            const occurrenceScore = Math.min(0.6, matches.length * 0.2);
            const positionScore = text.indexOf(skill.toLowerCase()) < text.length / 2 ? 0.2 : 0;
            const confidence = Math.min(1, occurrenceScore + positionScore);
            
            extractedSkills.push({
              name: skill,
              confidence: confidence,
              category: category
            });
          }
        } catch (error) {
          console.warn(`Error processing skill "${skill}":`, error);
          // Continue with other skills even if one fails
        }
      });
    });
    
    // Sort skills by confidence and then by category
    return extractedSkills
      .sort((a, b) => {
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        return a.category.localeCompare(b.category);
      });
  } catch (error) {
    console.error('Error processing PDF:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
    throw new Error('Failed to process PDF');
  }
} 