import { useEffect, useState } from 'react'
import { Card } from '../common/Card'
import { Spinner } from '../common/Spinner'
import { fetchHelpArticles } from '../../services/api'

type Article = {
  id: string
  title: string
  description?: string
  url?: string
}

const staticArticles: Article[] = [
  {
    id: 'supabase-docs',
    title: 'Documentação Supabase',
    description: 'Guia oficial para autenticação, banco de dados e Edge Functions.',
    url: 'https://supabase.com/docs',
  },
  {
    id: 'n8n-docs',
    title: 'Integrações com n8n',
    description: 'Aprenda a conectar fluxos automatizados com APIs externas.',
    url: 'https://docs.n8n.io/',
  },
  {
    id: 'tailwind-docs',
    title: 'Design com Tailwind CSS',
    description: 'Componentes utilitários para acelerar a prototipação.',
    url: 'https://tailwindcss.com/docs',
  },
]

export const HelpTab = () => {
  const [articles, setArticles] = useState<Article[]>(staticArticles)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true)
      setError(null)
      try {
        const remoteArticles = await fetchHelpArticles()
        if (Array.isArray(remoteArticles) && remoteArticles.length > 0) {
          setArticles((prev) => [...remoteArticles, ...prev])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível carregar artigos personalizados.')
      } finally {
        setLoading(false)
      }
    }

    void loadArticles()
  }, [])

  return (
    <div className="space-y-6">
      <Card
        title="Base de conhecimento"
        description="Centralize a documentação da sua equipe com artigos carregados via Edge Function ou workflow n8n."
      >
        {loading ? (
          <Spinner label="Carregando artigos" />
        ) : (
          <ul className="space-y-4 text-sm text-slate-300">
            {articles.map((article) => (
              <li key={article.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">{article.title}</h3>
                    {article.description ? (
                      <p className="text-xs text-slate-400">{article.description}</p>
                    ) : null}
                  </div>
                  {article.url ? (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-light"
                    >
                      Acessar
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {error ? <p className="mt-4 text-xs text-rose-400">{error}</p> : null}
      </Card>

      <Card title="Checklist rápido">
        <ol className="space-y-2 text-sm text-slate-300">
          <li>✅ Configure variáveis de ambiente no arquivo <code>.env</code> (ou painel de deploy).</li>
          <li>✅ Habilite autenticação por email/senha no Supabase Auth.</li>
          <li>✅ Publique uma tabela <code>records</code> com políticas RLS compatíveis.</li>
          <li>✅ Registre webhooks no n8n para inserir dados automaticamente.</li>
          <li>✅ Atualize o workflow da HostGator para enviar o build para <code>public_html</code>.</li>
        </ol>
      </Card>
    </div>
  )
}
