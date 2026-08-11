import { readFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const CONFIG_FILE = join(__dirname, 'projects.json')

function findProjectRoot(startDir: string) {
    let dir = resolve(startDir)
    while (dir !== dirname(dir)) {
        if (existsSync(join(dir, 'package.json'))) return dir
        dir = dirname(dir)
    }

    throw new Error('未找到项目根目录（未找到 package.json）')
}

function loadProjects() {
    try {
        const data = readFileSync(CONFIG_FILE, 'utf8')
        return JSON.parse(data)
    } catch (err: any) {
        console.error(`读取配置文件失败: ${err.message}`)
        process.exit(1)
    }
}

function handleProject(
    project: { name: any; repoUrl: any; branch: any; localPath: any },
    projectRoot: string,
) {
    const { name, repoUrl, branch, localPath } = project
    const targetDir = resolve(projectRoot, localPath)

    console.log(`\n========== 项目: ${name} ==========`)

    if (existsSync(targetDir)) {
        console.log(`目录已存在: ${targetDir}`)
        try {
            execFileSync('git', ['checkout', branch], {
                cwd: targetDir,
                stdio: 'inherit',
            })
            execFileSync('git', ['pull', 'origin', branch], {
                cwd: targetDir,
                stdio: 'inherit',
            })
            console.log(`✓ ${name} 更新完成`)
        } catch (err: any) {
            console.error(`✗ ${name} 更新失败: ${err.message}`)
        }
    } else {
        console.log(`克隆 ${repoUrl} 分支 ${branch} 到 ${targetDir}`)

        try {
            const parentDir = dirname(targetDir)
            if (!existsSync(parentDir)) {
                mkdirSync(parentDir, { recursive: true })
            }
            execFileSync('git', ['clone', '-b', branch, repoUrl, targetDir], {
                stdio: 'inherit',
            })

            console.log(`✓ ${name} 克隆完成`)
        } catch (err: any) {
            console.error(`✗ ${name} 克隆失败: ${err.message}`)
        }
    }
}

// 根据项目名称列表进行拉取
function processNames(names: any[], projects: any[], projectRoot: string) {
    const nameSet = new Set(names.map((n) => n.toLowerCase()))
    let selectedProjects = []

    if (nameSet.has('all')) {
        selectedProjects = projects
    } else {
        selectedProjects = projects.filter((p) =>
            nameSet.has(p.name.toLowerCase()),
        )
        if (selectedProjects.length === 0) {
            console.log('没有匹配的项目，请检查项目名是否正确。')
            console.log('可用项目: ' + projects.map((p) => p.name).join(', '))
            process.exit(1)
        }
        const unknown = names.filter(
            (n) =>
                !projects.some((p) => p.name.toLowerCase() === n.toLowerCase()),
        )
        if (unknown.length) {
            console.warn(`警告: 以下项目不存在: ${unknown.join(', ')}`)
        }
    }

    for (const project of selectedProjects) {
        handleProject(project, projectRoot)
    }
    console.log('\n所有任务执行完毕。')
}

// 交互式输入
function interactivePrompt(projects: any[], projectRoot: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    rl.question(
        '请输入要拉取的项目名（多个用空格分隔，输入 all 表示全部）: ',
        (answer) => {
            rl.close()
            const names = answer
                .trim()
                .split(/\s+/)
                .filter((s) => s)
            if (names.length === 0) {
                console.log('未输入任何项目，退出。')
                return
            }
            processNames(names, projects, projectRoot)
        },
    )
}

function main() {
    try {
        const projectRoot = findProjectRoot(__dirname)
        // console.log(`项目根目录: ${projectRoot}`)
        const projects = loadProjects()
        const args = process.argv.slice(2)
        if (args.length === 0) {
            interactivePrompt(projects, projectRoot)
        } else {
            processNames(args, projects, projectRoot)
        }
    } catch (err: any) {
        console.error(`错误: ${err.message}`)
        process.exit(1)
    }
}

main()
