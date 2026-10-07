import { useLanguage } from '@/contexts/LanguageContext';
import { languages, translations } from '@/lib/languages';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300"
        >
          <Globe className="w-4 h-4 mr-2" />
          {languages[language]?.flag} {language.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
        {Object.entries(languages).map(([lang, info]) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang as keyof typeof translations)}
            className={`cursor-pointer ${
              language === lang ? 'bg-yellow-400/20 text-yellow-300' : 'text-gray-300'
            }`}
          >
            {info.flag} {info.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
